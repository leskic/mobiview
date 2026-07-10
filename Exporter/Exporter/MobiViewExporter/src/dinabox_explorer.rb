# encoding: UTF-8

module MobiViewExporter

  module DinaboxExplorer

    extend self

    ############################################################
    # EXECUTA
    ############################################################

    def run(model)

      report = ""

      report << "=========================================\n"
      report << " DINABOX EXPLORER\n"
      report << "=========================================\n\n"

      pieces = EntityWalker.walk(model)

      report << "Projeto : #{model.title}\n"
      report << "Peças   : #{pieces.size}\n\n"

      types = {}
      attributes = {}

      pieces.each do |entity|

        dict = Utils.dynamic_attributes(entity)

        next unless dict

        raw = dict["dinabox_dados"]

        unless raw.nil?

          if raw =~ /^\[(.)\]/

            type = $1

            types[type] ||= 0

            types[type] += 1

          end

        end

        dict.each_pair do |k,v|

          attributes[k] ||= {}

          attributes[k][v.class] ||= 0

          attributes[k][v.class] += 1

        end

      end

      ###########################################################

      report << "TIPOS ENCONTRADOS\n\n"

      types.keys.sort.each do |t|

        report << "[#{t}] = #{types[t]}\n"

      end

      ###########################################################

      report << "\n\n"

      report << "ATRIBUTOS\n\n"

      attributes.keys.sort.each do |k|

        report << "#{k}\n"

      end

      ###########################################################

      report << "\n\n"

      report << "=========================================\n"

      report << "AMOSTRAS\n"

      report << "=========================================\n\n"

      pieces.first(20).each do |entity|

        dict = Utils.dynamic_attributes(entity)

        next unless dict

        report << "-----------------------------------------\n"

        report << "#{Utils.piece_code(entity)}\n"

        report << "#{Utils.piece_name(entity)}\n\n"

        report << "#{dict["dinabox_dados"]}\n\n"

      end

      file = UI.savepanel(

        "Salvar Explorer",

        "",

        "dinabox_explorer.txt"

      )

      return unless file

      File.open(file,"w:utf-8"){|f|

        f.write(report)

      }

      UI.messagebox("Explorer concluído.")

    end

  end

end